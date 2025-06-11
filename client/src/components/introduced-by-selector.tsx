import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Friend } from "@shared/schema";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";

interface IntroducedBySelectorProps {
  value?: number;
  onChange: (friendId: number | undefined) => void;
  excludeId?: number; // Exclude the current friend from the list
}

export function IntroducedBySelector({ value, onChange, excludeId }: IntroducedBySelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const { data: friends = [] } = useQuery<Friend[]>({
    queryKey: ["/api/friends"],
  });

  // Filter out the current friend if editing
  const availableFriends = friends.filter(friend => friend.id !== excludeId);

  const selectedFriend = availableFriends.find(friend => friend.id === value);

  const filteredFriends = availableFriends.filter(friend => {
    const fullName = `${friend.firstName} ${friend.lastName || ''}`.trim();
    return fullName.toLowerCase().includes(searchValue.toLowerCase());
  });

  return (
    <div className="space-y-2">
      <Label>Introduced By</Label>
      <div className="flex items-center space-x-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="flex-1 justify-between"
            >
              {selectedFriend 
                ? `${selectedFriend.firstName} ${selectedFriend.lastName || ''}`.trim()
                : "Select friend who introduced you..."
              }
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0">
            <Command>
              <CommandInput 
                placeholder="Search friends..." 
                value={searchValue}
                onValueChange={setSearchValue}
              />
              <CommandList>
                <CommandEmpty>No friends found.</CommandEmpty>
                <CommandGroup>
                  {filteredFriends.map((friend) => {
                    const fullName = `${friend.firstName} ${friend.lastName || ''}`.trim();
                    return (
                      <CommandItem
                        key={friend.id}
                        value={fullName}
                        onSelect={() => {
                          onChange(friend.id === value ? undefined : friend.id);
                          setOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            value === friend.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                            {friend.photo ? (
                              <img 
                                src={friend.photo} 
                                alt={`${fullName}'s photo`}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="text-xs font-semibold text-gray-500">
                                {friend.firstName.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <span>{fullName}</span>
                        </div>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        
        {selectedFriend && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onChange(undefined)}
            className="px-3"
          >
            <X size={16} />
          </Button>
        )}
      </div>
    </div>
  );
}